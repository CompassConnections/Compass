import { HeartIcon } from '@heroicons/react/solid'
import { Col } from 'web/components/layout/col'
import { Row } from 'web/components/layout/row'
import Link from 'next/link'

export default function ManifoldLove() {
  return (
    <div>
      <Col className="mx-auto w-full gap-8 px-4 pt-4 sm:pt-0">
        <Col className="gap-4">
          <Row className="border-scarlet-800 max-w-md items-center gap-2 border-b border-solid p-2">
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
            <h1 className="mx-auto text-3xl">
              CompassMeet.com
            </h1>
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
            <HeartIcon className="text-scarlet-600 h-8 w-8" />
          </Row>

          <div className="mt-2" />

          <Row className="justify-between rounded-lg px-3">
            <Col className="max-w-2xl gap-2">
              <h1 className="mb-6 text-2xl">The wait is over!</h1>
              <Link
                className="text-3xl text-pink-300 underline hover:text-pink-600"
                href="/"
              >
                Get started
              </Link>
            </Col>
          </Row>
        </Col>
      </Col>
    </div>
  )
}
